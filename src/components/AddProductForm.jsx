import React, { useState } from "react";

const initialState = {
  name: "",
  price: "",
  description: "",
  image: "",
  quantity: "",
  isLabTested: false,
};

export default function AddProductForm({ onAddProduct }) {
  const [formData, setFormData] = useState(initialState);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const onSubmit = (e) => {
    e.preventDefault();

    if (!formData.name.trim() || Number(formData.price) <= 0 || Number(formData.quantity) < 0) {
      return;
    }

    onAddProduct(formData);
    setFormData(initialState);
  };

  return (
    <section className="glass-panel p-5 sm:p-6">
      <div className="mb-4">
        <h2 className="section-title">Добавить новый фрукт</h2>
        <p className="muted mt-1">Заполните данные товара и опубликуйте его в вашем профиле.</p>
      </div>

      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <input
          name="name"
          placeholder="Название"
          value={formData.name}
          onChange={onChange}
          className="input-base"
          required
        />
        <input
          name="price"
          type="number"
          min="1"
          placeholder="Цена за кг"
          value={formData.price}
          onChange={onChange}
          className="input-base"
          required
        />
        <input
          name="quantity"
          type="number"
          min="0"
          placeholder="Количество (кг)"
          value={formData.quantity}
          onChange={onChange}
          className="input-base"
          required
        />
        <input
          name="image"
          placeholder="URL изображения"
          value={formData.image}
          onChange={onChange}
          className="input-base"
          required
        />
        <textarea
          name="description"
          placeholder="Описание"
          value={formData.description}
          onChange={onChange}
          className="input-base min-h-28 resize-y md:col-span-2"
          rows={3}
        />
        <label className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] md:col-span-2">
          <input
            name="isLabTested"
            type="checkbox"
            checked={formData.isLabTested}
            onChange={onChange}
            className="h-4 w-4 accent-[var(--brand)]"
          />
          Прошёл лабораторную проверку
        </label>

        <button type="submit" className="btn-primary md:col-span-2">
          Добавить товар
        </button>
      </form>
    </section>
  );
}
