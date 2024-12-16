export async function POST(req: Request) {
  if (req.method === "POST") {
    const body = await req.json();
    console.log("Received JSON data:", body);
    // Implement your logic here
  } else {
    return new Response("Invalid request method", { status: 405 });
  }

  return new Response("Data processed successfully", { status: 200 });
}
