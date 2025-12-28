"""
Streaming DXF Processor
Processes DXF files line-by-line without loading entire file into memory.
Designed for files 100MB+ up to several GB.
"""

import httpx
from loguru import logger
from typing import Optional
import re


async def stream_audit_large_dxf(file_url: str) -> dict:
    """
    Stream-process a large DXF file from URL.
    Extracts metadata without loading entire file into memory.
    
    Returns audit result with:
    - Layer names and counts
    - Entity counts by type
    - Bounding box (if available)
    - File statistics
    """
    logger.info(f"Starting streaming audit for: {file_url[:100]}...")
    
    stats = {
        'total_lines': 0,
        'layers': {},
        'entities': {
            'LINE': 0,
            'LWPOLYLINE': 0,
            'POLYLINE': 0,
            'CIRCLE': 0,
            'ARC': 0,
            'TEXT': 0,
            'MTEXT': 0,
            'INSERT': 0,
            'POINT': 0,
            'DIMENSION': 0,
            'SOLID': 0,
            'HATCH': 0,
            '3DFACE': 0,
            'SPLINE': 0,
            'ELLIPSE': 0,
            'OTHER': 0
        },
        'min_x': float('inf'),
        'max_x': float('-inf'),
        'min_y': float('inf'),
        'max_y': float('-inf'),
        'min_z': float('inf'),
        'max_z': float('-inf'),
        'version': 'Unknown',
        'errors': []
    }
    
    current_entity = None
    current_layer = None
    in_entities_section = False
    in_header_section = False
    prev_line = ""
    
    try:
        async with httpx.AsyncClient(timeout=300.0) as client:
            async with client.stream('GET', file_url) as response:
                if response.status_code != 200:
                    return {
                        'status': 'error',
                        'summary': {
                            'total_layers': 0,
                            'entities': 0,
                            'version': 'Unknown',
                            'score': 0,
                            'error': f'Failed to download file: {response.status_code}'
                        },
                        'layers': [],
                        'details': [{'code': 'DOWNLOAD_ERROR', 'severity': 'fail', 'message': f'HTTP {response.status_code}'}]
                    }
                
                buffer = ""
                async for chunk in response.aiter_text():
                    buffer += chunk
                    lines = buffer.split('\n')
                    buffer = lines[-1]  # Keep incomplete line for next iteration
                    
                    for line in lines[:-1]:
                        line = line.strip()
                        stats['total_lines'] += 1
                        
                        # Detect sections
                        if line == 'HEADER':
                            in_header_section = True
                            in_entities_section = False
                        elif line == 'ENTITIES':
                            in_entities_section = True
                            in_header_section = False
                        elif line == 'ENDSEC':
                            in_header_section = False
                            in_entities_section = False
                        
                        # Extract version from header
                        if in_header_section and prev_line == '9' and line == '$ACADVER':
                            pass  # Next value after 1 will be version
                        if in_header_section and prev_line == '1' and line.startswith('AC'):
                            version_map = {
                                'AC1014': 'R14',
                                'AC1015': '2000',
                                'AC1018': '2004',
                                'AC1021': '2007',
                                'AC1024': '2010',
                                'AC1027': '2013',
                                'AC1032': '2018'
                            }
                            stats['version'] = version_map.get(line, line)
                        
                        # Detect entity types
                        if in_entities_section and prev_line == '0':
                            if line in stats['entities']:
                                stats['entities'][line] += 1
                                current_entity = line
                            elif line not in ['ENDSEC', 'SEQEND', 'ATTRIB', 'VERTEX']:
                                stats['entities']['OTHER'] += 1
                                current_entity = 'OTHER'
                        
                        # Extract layer names (group code 8)
                        if prev_line == '8' and in_entities_section:
                            if line not in stats['layers']:
                                stats['layers'][line] = {'count': 0, 'color': 7}
                            stats['layers'][line]['count'] += 1
                            current_layer = line
                        
                        # Extract coordinates for bounding box
                        if prev_line == '10':  # X coordinate
                            try:
                                x = float(line)
                                stats['min_x'] = min(stats['min_x'], x)
                                stats['max_x'] = max(stats['max_x'], x)
                            except ValueError:
                                pass
                        if prev_line == '20':  # Y coordinate
                            try:
                                y = float(line)
                                stats['min_y'] = min(stats['min_y'], y)
                                stats['max_y'] = max(stats['max_y'], y)
                            except ValueError:
                                pass
                        if prev_line == '30':  # Z coordinate
                            try:
                                z = float(line)
                                stats['min_z'] = min(stats['min_z'], z)
                                stats['max_z'] = max(stats['max_z'], z)
                            except ValueError:
                                pass
                        
                        prev_line = line
                        
                        # Progress logging every 1M lines
                        if stats['total_lines'] % 1000000 == 0:
                            logger.info(f"Processed {stats['total_lines']:,} lines...")
        
        # Calculate results
        total_entities = sum(stats['entities'].values())
        layer_list = [
            {'name': name, 'color': data['color'], 'linetype': 'Continuous', 'entity_count': data['count']}
            for name, data in stats['layers'].items()
        ]
        
        # Generate issues
        issues = []
        
        # Check for unnamed layers
        if '' in stats['layers'] or '0' in stats['layers']:
            issues.append({
                'code': 'LAYER_DEFAULT',
                'severity': 'warning',
                'layer': '0',
                'message': 'Entidades en capa por defecto (0). Considerar organizar en capas nombradas.'
            })
        
        # Check bounding box for scale issues
        if stats['max_x'] != float('-inf'):
            width = stats['max_x'] - stats['min_x']
            height = stats['max_y'] - stats['min_y']
            if width > 10000 or height > 10000:
                issues.append({
                    'code': 'SCALE_LARGE',
                    'severity': 'warning',
                    'message': f'Dimensiones muy grandes ({width:.0f} x {height:.0f}). Verificar unidades.'
                })
        
        # Calculate score
        score = 100
        for issue in issues:
            if issue['severity'] == 'fail':
                score -= 20
            elif issue['severity'] == 'warning':
                score -= 5
        score = max(0, score)
        
        # Add pass message if no issues
        if not issues:
            issues.append({
                'code': 'ALL_CHECKS_PASSED',
                'severity': 'pass',
                'message': 'Archivo procesado correctamente. No se encontraron problemas.'
            })
        
        result = {
            'status': 'pass' if score >= 70 else ('warning' if score >= 50 else 'fail'),
            'summary': {
                'total_layers': len(stats['layers']),
                'entities': total_entities,
                'version': stats['version'],
                'score': score,
                'total_lines': stats['total_lines'],
                'bounding_box': {
                    'min': [stats['min_x'] if stats['min_x'] != float('inf') else 0,
                            stats['min_y'] if stats['min_y'] != float('inf') else 0,
                            stats['min_z'] if stats['min_z'] != float('inf') else 0],
                    'max': [stats['max_x'] if stats['max_x'] != float('-inf') else 0,
                            stats['max_y'] if stats['max_y'] != float('-inf') else 0,
                            stats['max_z'] if stats['max_z'] != float('-inf') else 0]
                }
            },
            'layers': layer_list[:50],  # Limit to first 50 layers
            'details': issues,
            'entity_breakdown': {k: v for k, v in stats['entities'].items() if v > 0}
        }
        
        logger.info(f"Streaming audit complete: {total_entities:,} entities, {len(stats['layers'])} layers, {stats['total_lines']:,} lines")
        return result
        
    except Exception as e:
        logger.error(f"Streaming audit error: {str(e)}")
        return {
            'status': 'error',
            'summary': {
                'total_layers': 0,
                'entities': 0,
                'version': 'Unknown',
                'score': 0,
                'error': str(e)
            },
            'layers': [],
            'details': [{'code': 'PROCESSING_ERROR', 'severity': 'fail', 'message': str(e)}]
        }
