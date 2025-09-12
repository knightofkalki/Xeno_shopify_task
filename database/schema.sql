-- Xeno Shopify Service Database Schema

-- Drop existing tables if needed (be careful!)
-- DROP TABLE IF EXISTS order_items CASCADE;
-- DROP TABLE IF EXISTS orders CASCADE;
-- DROP TABLE IF EXISTS products CASCADE;
-- DROP TABLE IF EXISTS customers CASCADE;
-- DROP TABLE IF EXISTS tenants CASCADE;

-- Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
    id SERIAL PRIMARY KEY,
    shop_domain VARCHAR(255) UNIQUE NOT NULL,
    shopify_access_token TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
    shopify_customer_id BIGINT NOT NULL,
    email VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    phone VARCHAR(20),
    total_spent DECIMAL(10,2) DEFAULT 0,
    orders_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, shopify_customer_id)
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
    shopify_product_id BIGINT NOT NULL,
    title VARCHAR(500),
    description TEXT,
    vendor VARCHAR(255),
    product_type VARCHAR(255),
    price DECIMAL(10,2) DEFAULT 0,
    inventory_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, shopify_product_id)
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
    shopify_order_id BIGINT NOT NULL,
    customer_id BIGINT,
    order_number VARCHAR(50),
    total_price DECIMAL(10,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    order_status VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, shopify_order_id)
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
    shopify_order_id BIGINT NOT NULL,
    product_id BIGINT,
    quantity INTEGER DEFAULT 1,
    price DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, shopify_order_id, product_id)
);

-- Insert default tenant for techmart-dev-store
INSERT INTO tenants (id, shop_domain, shopify_access_token, created_at, updated_at)
VALUES (1, 'techmart-dev-store.myshopify.com', '', NOW(), NOW())
ON CONFLICT (shop_domain) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_tenant_id ON orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_order_items_tenant_id ON order_items(tenant_id);

-- Show created tables
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
