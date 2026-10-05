from PIL import Image

def make_white_transparent(image_path, output_path, tolerance=240):
    img = Image.open(image_path)
    img = img.convert("RGBA")
    datas = img.getdata()
    
    new_data = []
    for item in datas:
        # Change all white (also shades of whites)
        # to transparent
        if item[0] >= tolerance and item[1] >= tolerance and item[2] >= tolerance:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    img.save(output_path, "PNG")

make_white_transparent("public/hero-logo-3d.png", "public/hero-logo-3d-transparent.png", tolerance=235)
