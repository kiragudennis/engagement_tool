// lib/bundles/order-items.ts

export async function createBundleOrderItems(
  supabase: any,
  orderId: string,
  bundle: any,
  selectedItems?: any[],
) {
  const orderItems = [];

  // Handle different bundle types
  if (bundle.bundle_type === "curated" && bundle.products?.items) {
    // Curated bundle - fixed items
    for (const item of bundle.products.items) {
      const { data: product } = await supabase
        .from("products")
        .select("id, name, price, images")
        .eq("id", item.product_id)
        .single();

      if (product) {
        orderItems.push({
          order_id: orderId,
          product_id: product.id,
          product_name: product.name,
          product_image: product.images?.[0] || null,
          quantity: item.quantity || 1,
          unit_price: product.price,
          total_price: product.price * (item.quantity || 1),
        });
      }
    }
  } else if (
    bundle.bundle_type === "build_own" &&
    selectedItems &&
    selectedItems.length > 0
  ) {
    // Build your own - customer selected items
    for (const selected of selectedItems) {
      const { data: product } = await supabase
        .from("products")
        .select("id, name, price, images")
        .eq("id", selected.product_id)
        .single();

      if (product) {
        orderItems.push({
          order_id: orderId,
          product_id: product.id,
          product_name: product.name,
          product_image: product.images?.[0] || null,
          quantity: selected.quantity || 1,
          unit_price: product.price,
          total_price: product.price * (selected.quantity || 1),
        });
      }
    }
  } else if (bundle.bundle_type === "tiered" && bundle.products?.items) {
    // Tiered bundle - fixed items
    for (const item of bundle.products.items) {
      const { data: product } = await supabase
        .from("products")
        .select("id, name, price, images")
        .eq("id", item.product_id)
        .single();

      if (product) {
        orderItems.push({
          order_id: orderId,
          product_id: product.id,
          product_name: product.name,
          product_image: product.images?.[0] || null,
          quantity: item.quantity || 1,
          unit_price: product.price,
          total_price: product.price * (item.quantity || 1),
        });
      }
    }
  } else if (bundle.bundle_type === "subscription" && bundle.products?.items) {
    // Subscription bundle - fixed items
    for (const item of bundle.products.items) {
      const { data: product } = await supabase
        .from("products")
        .select("id, name, price, images")
        .eq("id", item.product_id)
        .single();

      if (product) {
        orderItems.push({
          order_id: orderId,
          product_id: product.id,
          product_name: product.name,
          product_image: product.images?.[0] || null,
          quantity: item.quantity || 1,
          unit_price: product.price,
          total_price: product.price * (item.quantity || 1),
        });
      }
    }
  } else if (bundle.bundle_type === "bonus_points" && bundle.products?.items) {
    // Bonus points bundle - fixed items
    for (const item of bundle.products.items) {
      const { data: product } = await supabase
        .from("products")
        .select("id, name, price, images")
        .eq("id", item.product_id)
        .single();

      if (product) {
        orderItems.push({
          order_id: orderId,
          product_id: product.id,
          product_name: product.name,
          product_image: product.images?.[0] || null,
          quantity: item.quantity || 1,
          unit_price: product.price,
          total_price: product.price * (item.quantity || 1),
        });
      }
    }
  } else if (
    bundle.bundle_type === "mystery" &&
    bundle.products?.product_pool
  ) {
    // Mystery bundle - show placeholder items (actual products revealed later)
    for (let i = 0; i < (bundle.products.quantity || 3); i++) {
      orderItems.push({
        order_id: orderId,
        product_id: null,
        product_name: `Mystery Item ${i + 1}`,
        product_image: null,
        quantity: 1,
        unit_price: bundle.base_price / (bundle.products.quantity || 3),
        total_price: bundle.base_price / (bundle.products.quantity || 3),
        is_mystery_item: true,
      });
    }
  }

  // Insert all order items
  if (orderItems.length > 0) {
    const { error } = await supabase.from("order_items").insert(orderItems);
    if (error) throw error;
  }

  return orderItems;
}
