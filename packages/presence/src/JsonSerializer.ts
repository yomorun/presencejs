import { JsonSerializable } from "./types";

export class JsonSerializer {
  /**
   * Serialize any type of value into a JSON string
   * @param value the value to serialize
   * @returns Serialized JSON string
   */
  static serialize<T extends JsonSerializable>(value: T): string {
    try {
      return JSON.stringify(value);
    } catch (error: any) {
      // throw new Error("Failed to serialize the value to JSON: " + error.message);
      console.log("Failed to serialize the value to JSON: " + error.message)
      return value as unknown as string;
    }
  }

  /**
   * Deserialize a JSON string to the specified type
   * @param json the JSON string to deserialize
   * @returns deserialized value
   */
  static deserialize<T extends JsonSerializable>(json: string): T {
    try {
      return JSON.parse(json) as T;
    } catch (error: any) {
      // throw new Error("Failed to deserialize the JSON string: " + error.message);
      console.log("Failed to deserialize the JSON string: " + error.message)
      return json as unknown as T;
    }
  }
}
