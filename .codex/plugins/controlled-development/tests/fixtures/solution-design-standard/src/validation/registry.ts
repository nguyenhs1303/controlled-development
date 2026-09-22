export type Validator = (value: string) => boolean;

const validators = new Map<string, Validator>();

export function registerValidator(name: string, validator: Validator): void {
  validators.set(name, validator);
}

export function validate(name: string, value: string): boolean {
  const validator = validators.get(name);
  if (!validator) throw new Error(`Unknown validator: ${name}`);
  return validator(value);
}
