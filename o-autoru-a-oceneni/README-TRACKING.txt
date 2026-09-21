Heitmar Leather – doplnění měření DIY Boxu

Nahraďte v repozitáři soubor:
  diy-box-kozena-kabelka/index.html

a přidejte nový soubor:
  assets/diy-checkout.20260921b.js

Nově se měří:
- GA4: select_color
- GA4: begin_checkout
- Meta: custom event SelectColor
- Meta: standard event InitiateCheckout

Stávající měření zůstává:
- Meta: PageView, ViewContent, Lead
- GA4: diy_order_submitted, page_view a další stávající události

Po nahrání udělejte Commit + Push origin. Netlify nasadí změnu automaticky z větve main.
