import app from "./app";
import { env } from "./config/env";

app.listen(env.port, () => {
  console.log(`Auth Service running on port ${env.port}`);
});
