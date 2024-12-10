import { NextResponse } from "next/server";
import { listEnvTestEntries } from "../../../../../util/testEnv";

export const GET = () => NextResponse.json([...listEnvTestEntries()]);
