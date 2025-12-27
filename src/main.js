/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
  const { discount = 0, sale_price, quantity } = purchase;

  if (sale_price == null || quantity == null) {
    throw new Error("Некорректные данные покупки");
  }

  if (sale_price < 0 || quantity <= 0) {
    throw new Error("Цена или количество некорректны");
  }

  if (discount < 0 || discount > 100) {
    throw new Error("Скидка должна быть от 0 до 100%");
  }

  const decimalDiscount = discount / 100;
  const fullPrice = sale_price * quantity;
  const revenueWithDiscount = fullPrice * (1 - decimalDiscount);

  return Math.round(revenueWithDiscount * 100) / 100;
}
// @TODO: Расчет выручки от операции

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
  if (index === 0) {
    return seller.profit * 0.15;
  } else if (index === 1 || index === 2) {
    return seller.profit * 0.1;
  } else if (index === total - 1) {
    return 0;
  } else {
    return seller.profit * 0.05;
  }
}
// @TODO: Расчет бонуса от позиции в рейтинге

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
  // @TODO: Проверка входных данных

  if (
    !data ||
    !Array.isArray(data.sellers) ||
    !Array.isArray(data.products) ||
    !Array.isArray(data.purchase_records) ||
    data.sellers.length === 0 ||
    data.products.length === 0 ||
    data.purchase_records.length === 0
  ) {
    throw new Error("Некорректные входные данные");
  }

  // @TODO: Проверка наличия опций

  if (typeof options !== "object") {
    throw new Error("Некорректные входные данные");
  }

  const { calculateRevenue, calculateBonus } = options;

  if (
    typeof calculateRevenue !== "function" ||
    typeof calculateBonus !== "function"
  ) {
    throw new Error("Некорректные входные данные");
  }

  // @TODO: Подготовка промежуточных данных для сбора статистики

  const sellerStats = data.sellers.map((seller) => ({
    id: seller.id,
    name: `${seller.first_name} ${seller.last_name}`,
    revenue: 0,
    profit: 0,
    sales_count: 0,
    products_sold: {},
  }));

  // @TODO: Индексация продавцов и товаров для быстрого доступа

  const sellerIndex = sellerStats.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});

  const productIndex = data.products.reduce((acc, item) => {
    acc[item.sku] = item;
    return acc;
  }, {});

  // @TODO: Расчет выручки и прибыли для каждого продавца
  data.purchase_records.forEach((record) => {
    const seller = sellerIndex[record.seller_id];
    seller.sales_count = seller.sales_count + 1;

    record.items.forEach((item) => {
      const product = productIndex[item.sku];

      const cost = product.purchase_price * item.quantity;

      const revenue = calculateRevenue(item, product);

      const profit = revenue - cost;

      seller.revenue += revenue;
      seller.profit += profit;

      if (!seller.products_sold[item.sku]) {
        seller.products_sold[item.sku] = 0;
      }

      seller.products_sold[item.sku] += item.quantity;
    });
  });

  // @TODO: Сортировка продавцов по прибыли

  sellerStats.sort((a, b) => b.profit - a.profit);

  // @TODO: Назначение премий на основе ранжирования

  sellerStats.forEach((seller, index) => {
    seller.bonus = calculateBonusByProfit(index, sellerStats.length, seller);

    seller.top_products = Object.entries(seller.products_sold)
      .map(([sku, quantity]) => ({ sku, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  });

  // @TODO: Подготовка итоговой коллекции с нужными полями

  return sellerStats.map((seller) => ({
    seller_id: seller.id,
    name: seller.name,
    revenue: +seller.revenue.toFixed(2),
    profit: +seller.profit.toFixed(2),
    sales_count: seller.sales_count,
    top_products: seller.top_products,
    bonus: +seller.bonus.toFixed(2),
  }));
}
