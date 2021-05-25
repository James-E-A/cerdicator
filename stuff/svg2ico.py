import cairosvg.surface
from PIL import Image
from io import BytesIO


def svg2ico(*args, resolutions={None, 128, 96, 64, 48, 32, 24, 16}, write_to=None, dpi=96, **kwargs):
	maxres = max(resolutions, key=(lambda res: float('inf') if res is None else res))
	t = cairosvg.surface.Tree(*args, **kwargs)
	ims = []
	for res in resolutions:
		cairosvg.surface.PNGSurface(t, f:=BytesIO(), dpi,
		  output_width=res, output_height=res).finish()
		f.seek(0)
		ims.append(Image.open(f))
		if res is maxres:
			im = ims.pop()

	# https://github.com/mate-desktop/eom/issues/310
	# TODO https://github.com/python-pillow/Pillow/issues/2512
	return im.save(f:=(write_to or BytesIO()), format='ICO', append_images=ims)
	if not write_to:
		return f.get_value()


if __name__ == '__main__':
	import sys
	i, o = sys.argv[1:]
	svg2ico(url=i, write_to=o)
