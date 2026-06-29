export function toast({title, description, category}) {
    document.dispatchEvent(new CustomEvent('basecoat:toast', {
        detail: {
            config: {
                category,
                title,
                description,
            }
        }
    }))
}