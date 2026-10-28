import app from "./app";
import { env } from "./config/env";

app.listen(env.port, () => {
  console.log(`Task Service running on port ${env.port}`);
});
