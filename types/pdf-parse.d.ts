declare module "pdf-parse" {
  interface PDFParseResult {
    numpages: number
    numrender: number
    info: Record<string, unknown>
    metadata: any
    version: string
    text: string
  }

  function pdfParse(data: Buffer, options?: Record<string, unknown>): Promise<PDFParseResult>
  export default pdfParse
}
