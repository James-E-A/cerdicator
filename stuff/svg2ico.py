from PIL import Image
import cairosvg.surface
from io import BytesIO


def svg2ico(*args, resolutions={128, 96, 64, 48, 32, 16}, write_to=None, **kwargs):
	t = cairosvg.surface.Tree(*args, **kwargs)
	ims = []
	maxres = max(resolutions) if (None not in resolutions) else None
	for res in resolutions:
		f = BytesIO()
		cairosvg.surface.PNGSurface(t, f, 96,
		  output_width=res, output_height=res).finish()
		f.seek(0)
		if res is not maxres:
			ims.append(Image.open(f))
		else:
			im = Image.open(f)

	if write_to:
		return im.save(write_to, format='ICO', append_images=ims)
	else:
		f = BytesIO()
		im.save(f, format='ICO', append_images=ims)
		return f.get_value()

if __name__ == '__main__':
	import sys
	i, o = sys.argv[1:]
	svg2ico(url=i, write_to=o)
