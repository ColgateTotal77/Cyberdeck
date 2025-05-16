export async function navigate(path) {
    const response = await fetch(path);
    const html = await response.text();
    document.body.innerHTML = html;
    history.pushState({}, '', path);
}