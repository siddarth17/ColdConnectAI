export interface Template {
    id: string
    title: string
    type: 'Email' | 'Letter'
    content: string
    preview: string
    createdAt: string
    updatedAt?: string
    lastUsed: string
  }
  
  export interface CreateTemplateRequest {
    title: string
    type: 'Email' | 'Letter'
    content: string
  }
  
  export interface UpdateTemplateRequest {
    title: string
    type: 'Email' | 'Letter'
    content: string
  }
  
  export interface TemplateResponse {
    template: Template
  }
  
  export interface TemplatesResponse {
    templates: Template[]
  }
  
  export interface DeleteTemplateResponse {
    message: string
  }