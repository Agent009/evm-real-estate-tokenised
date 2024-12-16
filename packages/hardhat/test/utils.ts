export const generateUri = async (rooms: number, squareFoot: number, propertyAddress: string, listPrice: number) => {
  return `data:application/json;base64,${Buffer.from(
    JSON.stringify({
      name: "Property",
      description: "Property Description",
      image: "ipfs://QmWgZmXVvp83UpLuhRdQUWwT4x8NYPY67kF3u5E2Zqktyn",
      attributes: {
        rooms: "" + rooms,
        squareFoot: "" + squareFoot,
        propertyAddress: propertyAddress,
        listPrice: "" + listPrice,
      },
    }),
  ).toString("base64")}`;
};
