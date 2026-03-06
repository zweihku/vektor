export function usePrint() {
  function printResume() {
    window.print()
  }
  return { printResume }
}
