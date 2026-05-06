import { Handler } from "aws-lambda";

export const handler: Handler = async (event) => {
  const exampleKey = process.env.EXAMPLE_KEY ?? "(not set)";
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Hello, World!",
      exampleKey,
    }),
  };
};
