import re

def fix_prices():
    with open('js/data.js', 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # Base pricing for categories
    import random
    
    category_prices = {
        'starters': (60, 90),
        'maincourse': (80, 120),
        'breads': (20, 40),
        'rice': (60, 90),
        'desserts': (50, 80),
        'beverages': (30, 50)
    }

    in_items = False
    for i, line in enumerate(lines):
        if 'const MENU_ITEMS =' in line:
            in_items = True
        elif 'const PACKAGES =' in line:
            in_items = False
            
        if in_items and 'category:' in line:
            # extract category
            cat_match = re.search(r'category:\s*"([^"]+)"', line)
            if cat_match:
                cat = cat_match.group(1)
                # assign a random but reasonable price divisible by 5
                min_p, max_p = category_prices.get(cat, (40, 80))
                price = (random.randint(min_p, max_p) // 5) * 5
                
                # replace price
                line = re.sub(r'price:\s*\d+', f'price: {price}', line)
                lines[i] = line

    with open('js/data.js', 'w', encoding='utf-8') as f:
        f.writelines(lines)

    print("Prices fixed.")

if __name__ == '__main__':
    fix_prices()
