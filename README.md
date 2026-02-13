Project Name: Retail POS System (Electron & React)

Background: Designed and built a custom Point of Sale system for my own retail business in Portland to replace expensive legacy software. Currently handling daily transactions, inventory management, and sales analytics.

Tech Stack:

Core: Electron, React, TypeScript

Data: SQLite (Local) / Moving to Supabase (Cloud)

Hardware: Integrated with Thermal Printers (ESC/POS) & Barcode Scanners

Features: Real-time dashboard, CSV Export, Silent Printing, Dark Mode UI

Key Highlights:

Optimized SQL queries for generating sales reports.

Implemented "Silent Printing" for instant receipt generation.

Built a responsive "Clean Fit" UI for fast cashier operations.

Automatic Barcode Generation: Automatically generates CODE128 barcodes for products without existing tags.

Label Printing: Renders custom 1"x0.5" product labels using HTML5 Canvas and exports them to local file system for thermal printing.

### Install

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```
