function PageOrnaments({ className = '' }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <img
        src="/ornaments/crossref-wave.svg"
        alt=""
        className="absolute left-1/2 top-0 w-[48rem] max-w-none -translate-x-1/2 opacity-25 blur-[0.25px]"
      />
      <img
        src="/ornaments/crossref-threads.svg"
        alt=""
        className="absolute -left-20 top-28 w-[24rem] max-w-none opacity-35"
      />
      <img
        src="/ornaments/crossref-lens.svg"
        alt=""
        className="absolute right-[-5rem] top-20 w-[20rem] max-w-none opacity-30"
      />
      <img
        src="/ornaments/crossref-mark.svg"
        alt=""
        className="absolute bottom-[-2rem] left-[-1.5rem] w-40 max-w-none opacity-20"
      />
    </div>
  )
}

export default PageOrnaments
