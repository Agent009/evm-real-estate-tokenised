export const generateUri = async (rooms: number, squareFoot: number, propertyAddress: string, listPrice: number) => {
  return `data:application/json;base64,${Buffer.from(
    JSON.stringify({
      name: "Property",
      description: "Property Description",
      image: "",
      attributes: {
        rooms: "" + rooms,
        squareFoot: "" + squareFoot,
        propertyAddress: propertyAddress,
        listPrice: "" + listPrice,
      },
    }),
  ).toString("base64")}`;
};
