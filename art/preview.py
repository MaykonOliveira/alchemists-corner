import sys
sys.path.insert(0, '/home/user/alchemists-corner/art')
from room import draw_room
c = draw_room()
c.im.resize((c.w * 3, c.h * 3), 0).save('/tmp/room.png')
