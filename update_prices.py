import re

def update_prices():
    with open('js/data.js', 'r', encoding='utf-8') as f:
        content = f.read()

    # We will split into MENU_ITEMS and PACKAGES
    # First, let's just find all "price: X" and adjust them.
    # We will differentiate based on the value or context.
    
    # Update MENU_ITEMS prices (values usually 30-450)
    def reduce_item_price(match):
        prefix = match.group(1)
        old_price = int(match.group(2))
        suffix = match.group(3)
        
        # Scale item prices down so a meal of ~7 items costs around 500-1000
        # Let's map 100-450 to 50-150
        if old_price > 100:
            new_price = max(40, int(round((old_price / 2.5) / 10.0) * 10))
        else:
            new_price = old_price
            
        return f"{prefix}{new_price}{suffix}"
        
    # Replace items price (they are on lines with "category:")
    def item_sub(match):
        line = match.group(0)
        return re.sub(r'(price:\s*)(\d+)(,)', reduce_item_price, line)
        
    content = re.sub(r'^.*category:.*$', item_sub, content, flags=re.MULTILINE)
    
    # Update PACKAGES prices
    def package_sub(match):
        line = match.group(0)
        
        # We want to distribute the packages into ~499, ~749, ~999
        def replace_pkg_price(m):
            prefix = m.group(1)
            old_price = int(m.group(2))
            suffix = m.group(3)
            
            if old_price <= 1399:
                new_price = 499
            elif old_price <= 1899:
                new_price = 749
            else:
                new_price = 999
                
            return f"{prefix}{new_price}{suffix}"
            
        return re.sub(r'(price:\s*)(\d+)(,)', replace_pkg_price, line)

    content = re.sub(r'^.*price:\s*\d+,.*$', package_sub, content, flags=re.MULTILINE)

    with open('js/data.js', 'w', encoding='utf-8') as f:
        f.write(content)

    print("Prices updated successfully.")

if __name__ == '__main__':
    update_prices()
