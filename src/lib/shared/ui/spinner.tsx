export const Spinner = () => {
  return (
    <div className="h-[100%] flex items-center justify-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-loader-circle  animate-spin m-auto">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
    </div>
  )
}
