export interface UiComponentContract {
  id: string;
  displayName: string;
}

export interface UseFormContract<T> {
  initialValues: T;
}
