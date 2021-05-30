import cairosvg.surface  # https://cairosvg.org/
from PIL import Image  # https://python-pillow.org/
from io import BytesIO


def svg2ico(*args, resolutions={96, 48, 32, 24, 16}, write_to=None, **kwargs):
	t = cairosvg.surface.Tree(*args, **kwargs)
	ims = []
	for res in resolutions:
		cairosvg.surface.PNGSurface(t, f:=BytesIO(), res * 2,
		  output_width=res, output_height=res).finish()
		f.seek(0)
		ims.append(Image.open(f))
	im = ims.pop(ims.index(max(ims, key=lambda im: sum(im.size))))

	# TODO Fix for MATE Desktop and Windows XP users
	# https://github.com/mate-desktop/eom/issues/310
	# https://github.com/python-pillow/Pillow/issues/2512
	im.save(f:=write_to or BytesIO(), format='ICO', append_images=ims, sizes=[im.size for im in [im] + ims])
	if not write_to:
		return f.get_value()


if __name__ == '__main__':
	import sys
	i, o = sys.argv[1:]
	svg2ico(url=i, write_to=o)
