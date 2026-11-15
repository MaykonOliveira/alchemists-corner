"""Leitura do atlas clássico (pixel art): nomes e medidas dos quadros que o visual vetorial precisa repetir."""
import json, os
from PIL import Image

HERE = os.path.dirname(__file__)
CLASSIC = os.path.join(HERE, '..', '..', 'src', 'assets', 'sprites')
_cache = {}


def classic_frames():
    if not _cache:
        meta = json.load(open(os.path.join(CLASSIC, 'shop.json')))['frames']
        sheet = Image.open(os.path.join(CLASSIC, 'shop.png')).convert('RGBA')
        for n, f in meta.items():
            r = f['frame']
            _cache[n] = sheet.crop((r['x'], r['y'], r['x'] + r['w'], r['y'] + r['h']))
    return _cache
