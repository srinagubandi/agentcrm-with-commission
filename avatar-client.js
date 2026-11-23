const form = document.querySelector('#photo-form');
if (form) form.addEventListener('submit', async event => {
  event.preventDefault();
  const status = form.querySelector('[role=status]');
  const button = form.querySelector('button');
  button.disabled = true;
  let bitmap;
  try {
    const file = form.elements.photo.files[0];
    if (!file || !['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 8*1024*1024)
      throw Error('Choose a JPEG, PNG or WebP photo up to 8 MB.');
    bitmap = await createImageBitmap(file);
    const size = Math.min(bitmap.width,bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 192;
    canvas.getContext('2d').drawImage(bitmap,(bitmap.width-size)/2,(bitmap.height-size)/2,size,size,0,0,192,192);
    const blob = await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
    if (!blob) throw Error('This photo could not be prepared.');
    const response = await fetch('/profile/photo',{method:'POST',headers:{'X-CSRF-Token':form.elements.csrf.value,'Content-Type':'image/png'},body:blob});
    if (response.status!==204) throw Error('Photo could not be saved. Refresh and try again.');
    location.assign('/profile?saved=1');
  } catch (error) {status.textContent=error.message} finally {bitmap?.close();button.disabled=false}
});
