import { FieldGroup, FieldGroupInput, FieldLabel } from "@/components/ui/field";

type AttributionFieldsProps = {
  name: string;
  handle: string;
  onNameChange: (value: string) => void;
  onHandleChange: (value: string) => void;
};

export function AttributionFields({ name, handle, onNameChange, onHandleChange }: AttributionFieldsProps) {
  return (
    <div className="flex flex-wrap gap-inset [&_.field-group]:min-w-[min(100%,140px)] [&_.field-group]:flex-1">
      <FieldGroup>
        <FieldLabel>
          <span className="sr-only">Your name</span>
          <FieldGroupInput
            name="name"
            placeholder="Your name…"
            autoComplete="name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
          />
        </FieldLabel>
      </FieldGroup>
      <FieldGroup>
        <FieldLabel>
          <span className="sr-only">Your handle</span>
          <FieldGroupInput
            name="username"
            placeholder="@handle…"
            autoComplete="username"
            spellCheck={false}
            value={handle}
            onChange={(e) => onHandleChange(e.target.value)}
          />
        </FieldLabel>
      </FieldGroup>
    </div>
  );
}
