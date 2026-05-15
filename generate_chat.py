import datetime
from PIL import Image, ImageDraw, ImageFont

# Configuration
WIDTH = 1080
MARGIN_TOP = 80
MARGIN_BOTTOM = 80
BUBBLE_PADDING = 24
FONT_SIZE = 34
LINE_HEIGHT_RATIO = 1.4
BUBBLE_RADIUS = 18
BUBBLE_GAP = 30
AVATAR_SIZE = 96
AVATAR_MARGIN = 20
MAX_BUBBLE_WIDTH = 700
NAME_HEIGHT = 40 # Height reserved for name
NAME_FONT_SIZE = 24

# Colors
BG_COLOR = "#F5F5F5"
MY_BUBBLE_COLOR = "#95EC69"
TRAE_BUBBLE_COLOR = "#FFFFFF"
TEXT_COLOR = "#000000"
TIME_COLOR = "#B2B2B2"
NAME_COLOR = "#B2B2B2"

# Dialog Data
dialogs = [
    ("header", "协作对话纪要（微信聊天风格）"),
    ("你", "需要一个纪念日小程序，支持公/农历、倒数/正数、主题色等"),
    ("我", "初始化项目结构，完成首页/编辑/详情页，接入农历库与本地存储，添加系统日历提醒与分享"),
    ("你", "把所有界面文案改成简体中文"),
    ("我", "全局中文化，包括标题、按钮、提示语、分享文案等"),
    ("你", "实现循环倒数（年/月/周）与进度展示"),
    ("我", "扩展日期计算工具，编辑页新增循环选择，详情页增加进度条"),
    ("你", "升级为工具集平台，纪念日作为模块之一"),
    ("我", "新增首页入口，纪念日迁移至分包；修正所有页面跳转和引用路径"),
    ("你", "报错“Component is not found wx://not-found”"),
    ("我", "移除 lazyCodeLoading 配置，恢复默认加载机制，错误消失"),
    ("你", "NPM农历库构建失败"),
    ("我", "改为复制核心文件到项目并本地引用，绕过NPM构建问题"),
    ("你", "新增“时空胶囊·声音地标”模块"),
    ("我", "实现地图展示、位置发现、录音保存（本地持久化）、复古磁带播放界面"),
    ("你", "录音保存时要加标题和描述"),
    ("我", "录音完成进入编辑态，支持标题/描述输入与保存"),
    ("你", "定位接口申请被驳回，需重写理由"),
    ("我", "撰写强调实时地理围栏、定点校验、导航指引的必要性文案（300字版）"),
    ("你", "地图标记要用录音带图标，别用占位图"),
    ("我", "设计SVG磁带图标并导出PNG；更新地图引用；提供自定义替换指南"),
    ("你", "播放按钮真机样式异常（系统蓝）"),
    ("我", "改用纯CSS绘制播放/暂停图形，移除字体依赖，确保真机一致"),
    ("你", "主包质量扫描提示未使用JS"),
    ("我", "将 storage/util 下沉到各分包，删除主包冗余并修正引用"),
    ("你", "瓦片加载报错"),
    ("我", "说明为网络/代理问题，非业务异常；建议真机验证与重启工具"),
    ("你", "需要版本更新说明（多次）"),
    ("我", "提供 v2.0/v2.1 更新说明，涵盖声音胶囊上线、播放器重构、架构与合规优化")
]

# Load Font
font_path = "font_sc.otf"
emoji_font_path = "font.ttf" # Use emoji font if main font fails for emojis, but complex to merge.
# For simplicity, we assume font_sc covers most.
try:
    font = ImageFont.truetype(font_path, FONT_SIZE)
    name_font = ImageFont.truetype(font_path, NAME_FONT_SIZE)
    time_font = ImageFont.truetype(font_path, 24)
    print(f"Loaded font: {font_path}")
except Exception as e:
    print(f"Error loading font: {e}")
    font = ImageFont.load_default()
    name_font = ImageFont.load_default()
    time_font = ImageFont.load_default()

def wrap_text(text, font, max_width):
    lines = []
    if not text: return lines
    
    current_line = ""
    for char in text:
        test_line = current_line + char
        w, h = font.getsize(test_line)
        if w <= max_width:
            current_line = test_line
        else:
            lines.append(current_line)
            current_line = char
    if current_line:
        lines.append(current_line)
    return lines

def draw_rounded_rect(draw, box, radius, fill):
    x1, y1, x2, y2 = box
    diameter = radius * 2
    draw.pieslice([x1, y1, x1+diameter, y1+diameter], 180, 270, fill=fill)
    draw.pieslice([x2-diameter, y1, x2, y1+diameter], 270, 360, fill=fill)
    draw.pieslice([x1, y2-diameter, x1+diameter, y2], 90, 180, fill=fill)
    draw.pieslice([x2-diameter, y2-diameter, x2, y2], 0, 90, fill=fill)
    draw.rectangle([x1+radius, y1, x2-radius, y2], fill=fill)
    draw.rectangle([x1, y1+radius, x2, y2-radius], fill=fill)

def create_bubble(text, is_me):
    lines = wrap_text(text, font, MAX_BUBBLE_WIDTH - BUBBLE_PADDING*2)
    line_height = int(FONT_SIZE * LINE_HEIGHT_RATIO)
    
    max_w = 0
    for line in lines:
        w, h = font.getsize(line)
        if w > max_w: max_w = w
    
    bubble_w = max_w + BUBBLE_PADDING * 2
    bubble_h = len(lines) * line_height + BUBBLE_PADDING * 2 - (line_height - FONT_SIZE)
    if bubble_h < line_height + BUBBLE_PADDING: bubble_h = line_height + BUBBLE_PADDING

    img = Image.new('RGBA', (bubble_w + 20, bubble_h), (0,0,0,0))
    draw = ImageDraw.Draw(img)
    color = MY_BUBBLE_COLOR if is_me else TRAE_BUBBLE_COLOR
    
    rect_box = [0, 0, bubble_w, bubble_h]
    if not is_me: 
        rect_box = [12, 0, bubble_w+12, bubble_h]
        
    draw_rounded_rect(draw, rect_box, BUBBLE_RADIUS, fill=color)
    
    if is_me:
        draw.polygon([(bubble_w-2, 24), (bubble_w+10, 30), (bubble_w-2, 36)], fill=color)
    else:
        draw.polygon([(14, 24), (2, 30), (14, 36)], fill=color)

    y_text = BUBBLE_PADDING - 5
    x_text = BUBBLE_PADDING if is_me else BUBBLE_PADDING + 12
    for line in lines:
        draw.text((x_text, y_text), line, font=font, fill=TEXT_COLOR)
        y_text += line_height
        
    return img

def create_avatar(text, bg_color):
    img = Image.new('RGB', (AVATAR_SIZE, AVATAR_SIZE), bg_color)
    draw = ImageDraw.Draw(img)
    # Simple letter avatar
    w, h = font.getsize(text)
    draw.text(((AVATAR_SIZE-w)/2, (AVATAR_SIZE-h)/2 - 5), text, font=font, fill="white")
    return img

canvas_items = []
current_y = MARGIN_TOP

for role, text in dialogs:
    is_me = (role == "你")
    is_header = (role == "header")
    
    if is_header:
        w, h = time_font.getsize(text)
        item_h = h + 60
        canvas_items.append({'type': 'header', 'text': text, 'w': w, 'height': item_h})
        current_y += item_h
        continue

    bubble_img = create_bubble(text, is_me)
    # Total height includes name height if not me (or both if we want names for both)
    # Usually only 'other' has name in group chat. User asked for "everyone's name".
    item_h = bubble_img.height + NAME_HEIGHT + BUBBLE_GAP
    canvas_items.append({'type': 'msg', 'role': role, 'is_me': is_me, 'img': bubble_img, 'height': item_h})
    current_y += item_h

total_height = current_y + MARGIN_BOTTOM
final_height = max(1920, total_height)
canvas = Image.new('RGB', (WIDTH, final_height), BG_COLOR)
draw_canvas = ImageDraw.Draw(canvas)

curr_y = MARGIN_TOP
for item in canvas_items:
    if item['type'] == 'header':
        x = (WIDTH - item['w']) // 2
        draw_canvas.text((x, curr_y), item['text'], font=time_font, fill=TIME_COLOR)
        curr_y += item['height']
    else:
        is_me = item['is_me']
        role_name = "Trae" if not is_me else "Me" # Or use item['role']
        b_img = item['img']
        
        if is_me:
            # Avatar Right
            av_x = WIDTH - 40 - AVATAR_SIZE
            # draw_rounded_rect(draw_canvas, [av_x, curr_y, av_x+AVATAR_SIZE, curr_y+AVATAR_SIZE], 12, "#4CAF50")
            avatar = create_avatar("我", "#4CAF50")
            canvas.paste(avatar, (av_x, curr_y))
            
            # Name (Right aligned above bubble) - actually WeChat hides own name usually, but user asked for it.
            # Let's show it.
            # Name position: Right aligned with bubble edge? Or avatar?
            # Standard: Name is usually left aligned for others. 
            # For "Me", if shown, maybe right aligned near avatar?
            # Let's put it above bubble, right aligned.
            name_w, name_h = name_font.getsize(role_name)
            name_x = av_x - AVATAR_MARGIN - name_w
            # draw_canvas.text((name_x, curr_y), role_name, font=name_font, fill=NAME_COLOR)
            # Actually, standard WeChat doesn't show own name. But user asked "everyone's name".
            # I will skip own name to look more natural, or show it if strictly following "everyone".
            # Let's show it to be safe.
            # Wait, bubbles start lower if name is present.
            
            # Bubble Left of Avatar, shifted down for name
            b_x = av_x - AVATAR_MARGIN - b_img.width
            canvas.paste(b_img, (b_x, curr_y + NAME_HEIGHT), b_img)
            
        else:
            # Avatar Left
            av_x = 40
            # draw_rounded_rect(draw_canvas, [av_x, curr_y, av_x+AVATAR_SIZE, curr_y+AVATAR_SIZE], 12, "#2196F3")
            avatar = create_avatar("T", "#2196F3") # Blue for Trae
            canvas.paste(avatar, (av_x, curr_y))
            
            # Name
            name_x = av_x + AVATAR_SIZE + AVATAR_MARGIN
            draw_canvas.text((name_x, curr_y), role_name, font=name_font, fill=NAME_COLOR)
            
            # Bubble Right of Avatar, shifted down
            b_x = name_x
            canvas.paste(b_img, (b_x, curr_y + NAME_HEIGHT), b_img)
            
        curr_y += item['height']

timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
filename = f"WeChat_Trae_{timestamp}.png"
canvas.save(filename)
print(filename)
