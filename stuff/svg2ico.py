import cairosvg.surface
from PIL import Image
from io import BytesIO


def svg2ico(*args, resolutions={128, 96, 64, 48, 32, 24, 16}, write_to=None, **kwargs):
	t = cairosvg.surface.Tree(*args, **kwargs)
	ims = []
	maxres = max(resolutions) if (None not in resolutions) else None
	for res in resolutions:
		cairosvg.surface.PNGSurface(t, f:=BytesIO(), 96,
		  output_width=res, output_height=res).finish()
		f.seek(0)
		if res is not maxres:
			ims.append(Image.open(f))
		else:
			im = Image.open(f)

	# TODO https://github.com/mate-desktop/eom/issues/310
	# TODO https://github.com/python-pillow/Pillow/issues/2512
	return im.save(f:=write_to or BytesIO(), format='ICO', append_images=ims)
	if not write_to:
		return f.get_value()

if __name__ == '__main__':
	import sys
	i, o = sys.argv[1:]
	svg2ico(url=i, write_to=o)
