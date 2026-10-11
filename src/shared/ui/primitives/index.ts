/**
 * The shared primitives. Import from here, not from the files behind it.
 *
 * Before these existed the admin had four shared components for 174 pages,
 * so every page rebuilt its own buttons, labels, cards and headers. The
 * measured result was 219 distinct spellings of a brand-coloured button.
 * `design-system-adoption.test.ts` holds the line.
 */
export { cn } from './cn';
export {
  CONTROL_PADDING,
  CONTROL_PADDING_SQUARE,
  CONTROL_TYPE,
  DISABLED,
  FOCUS_RING,
  RADIUS,
  type ControlSize,
} from './scale';
export { Button, IconButton, type ButtonProps, type ButtonVariant, type IconButtonProps } from './Button';
export { Field, Input, SearchInput, type FieldProps, type InputProps } from './Field';
export { Badge, Card, EmptyState, PageHeader, type PageHeaderProps } from './Surface';
