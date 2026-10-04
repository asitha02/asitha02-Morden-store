# Spare parts API (Next.js)

A small Next.js server that saves the products and their photos so every computer sees the same data.
The Angular app (in the folder above) talks to it. Orders, cart and wishlist stay in the browser.

## Run it (two terminals)

```bash
# terminal 1 – the API (http://localhost:3000)
cd backend
npm install
npm run dev

# terminal 2 – the Angular app (http://localhost:4200)
npm start
```

`ng serve` forwards `/api` and `/uploads` to port 3000 (see `proxy.conf.json` in the project root),
so just open **http://localhost:4200**.

## Where the data is saved

- `data/db.json` – all products
- `data/uploads/` – the product photos

Commit the `data` folder to git and anyone who clones the project gets your products and photos.

## Endpoints

| Method | URL | What it does |
| --- | --- | --- |
| GET | `/api/products` | all products |
| POST | `/api/products` | add a product (creates the unique item code, saves photos) |
| GET / PUT / DELETE | `/api/products/:id` | one product: read, edit, delete |
| POST | `/api/products/stock` | change stock (used when orders are placed, edited or deleted) |
| GET | `/uploads/:file` | a product photo |

## Moving products you added in the old browser-only version

1. Open the old app in the browser where you added the products, press **F12 → Console**, paste this and press Enter
   (if Chrome says "don't paste", type `allow pasting` first):

   ```js
   const a = document.createElement('a');
   a.href = URL.createObjectURL(new Blob([JSON.stringify({
     products: JSON.parse(localStorage.getItem('sp.products') || '[]'),
     counter: Number(localStorage.getItem('sp.itemCounter') || 0),
   })], { type: 'application/json' }));
   a.download = 'sp-export.json';
   a.click();
   ```

2. Put the downloaded `sp-export.json` inside this `backend` folder and run:

   ```bash
   npm run import -- sp-export.json
   ```

This replaces the products in `data/db.json` and saves the photos into `data/uploads/`.
