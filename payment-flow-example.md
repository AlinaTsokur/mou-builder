# Payment Flow Example: The Row Deal

## Кто участвует

Есть 3 стороны:

**Seller** — продавец.  
Он купил объект у **Aldar**, но еще не выплатил всю цену по SPA.

**Buyer** — покупатель.  
Он покупает объект у Seller.

**Developer / Aldar** — застройщик.  
Ему еще должны деньги по рассрочке / payment plan.

## Суммы из сделки

**Original Price** — цена объекта по SPA с Aldar: **5,612,300 AED**.

**Selling Price** — цена сделки между Seller и Buyer: **5,400,000 AED**.

Seller уже оплатил Aldar: **280,615 AED**.

Для transfer нужно, чтобы Aldar получил минимум **30%** от Original Price:

```text
5,612,300 x 30% = 1,683,690 AED
```

Но Seller уже оплатил только **280,615 AED**, значит на сделке Buyer должен доплатить Aldar:

```text
1,683,690 - 280,615 = 1,403,075 AED
```

Это **Threshold Top-up to Developer**.

После этого у Aldar все равно остается неоплаченная рассрочка:

```text
5,612,300 - 280,615 - 1,403,075 = 3,928,610 AED
```

Это **Remaining Developer Balance**. Buyer не платит это Seller. Buyer берет на себя эту рассрочку и дальше платит Aldar по payment plan.

Теперь считаем, сколько Buyer реально платит Seller:

```text
Selling Price 5,400,000
- Top-up to Aldar 1,403,075
- Remaining Developer Balance 3,928,610
= 68,315 AED
```

Это **Amount to be paid to Seller**.

## Что происходит на сделке

Buyer приходит не просто с одной суммой Seller. Деньги разделяются:

1. Buyer платит Seller: **68,315 AED**.
2. Buyer платит Aldar на transfer date: **1,403,075 AED**, чтобы довести оплату до 30%.
3. Buyer принимает на себя оставшуюся рассрочку перед Aldar: **3,928,610 AED**, и платит ее позже по payment plan.
4. Buyer платит transfer fee: **4,000 AED**.
5. Buyer платит ADM fee: **108,575 AED**.
6. Buyer дает security deposit cheque: **540,000 AED**.

Итог: Seller получает только **68,315 AED**, потому что почти вся ценность сделки уходит в обязательства перед Aldar.
