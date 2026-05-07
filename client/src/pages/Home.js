function Home() {
  const foods = [
    {
      id: 1,
      name: "Burger",
      price: "$10"
    },
    {
      id: 2,
      name: "Pizza",
      price: "$15"
    },
    {
      id: 3,
      name: "Pasta",
      price: "$12"
    }
  ];

  return (
    <div style={{ padding: "20px" }}>
      <h1>Food Ordering App 🍔</h1>

      {foods.map((food) => (
        <div
          key={food.id}
          style={{
            border: "1px solid gray",
            padding: "10px",
            marginBottom: "10px"
          }}
        >
          <h2>{food.name}</h2>
          <p>{food.price}</p>

          <button>Order Now</button>
        </div>
      ))}
    </div>
  );
}

export default Home;