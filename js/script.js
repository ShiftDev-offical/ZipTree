let generatedTreeText = "";
const zipInput = document.getElementById('zipInput');
const dropZone = document.getElementById('dropZone');
const statusBadge = document.getElementById('statusBadge');

dropZone.addEventListener('click', () => zipInput.click());

['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => { 
        e.preventDefault(); 
        dropZone.classList.add('dragover'); 
    }, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => { 
        e.preventDefault(); 
        dropZone.classList.remove('dragover'); 
    }, false);
});

dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length) {
        zipInput.files = files;
        handleZipFile(files[0]);
    }
});

zipInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) handleZipFile(file);
});

function handleZipFile(file) {
    document.getElementById('uploadText').innerText = `الملف المختار: ${file.name}`;
    document.getElementById('output').innerText = "جاري قراءة الملف وبناء الشجرة المتصلة ذكياً...";
    statusBadge.innerText = "جاري المعالجة...";

    const reader = new FileReader();
    reader.onload = function(event) {
        JSZip.loadAsync(event.target.result).then(function(zip) {
            
            let root = { folders: {}, files: [] };

            Object.keys(zip.files).forEach(function(path) {
                if (path.trim() === "" || path === "/") return;
                
                let parts = path.split('/').filter(p => p.length > 0);
                let current = root;
                let isFolder = path.endsWith('/');
                
                for (let i = 0; i < parts.length; i++) {
                    let part = parts[i];
                    if (i === parts.length - 1 && !isFolder) {
                        if (!current.files.includes(part)) current.files.push(part);
                    } else {
                        if (!current.folders[part]) {
                            current.folders[part] = { folders: {}, files: [] };
                        }
                        current = current.folders[part];
                    }
                }
            });

            let treeOutput = "";
            
            function renderTree(node, prefix = "") {
                let sortedFolders = Object.keys(node.folders).sort();
                let sortedFiles = node.files.sort();
                
                let totalElements = sortedFolders.length + sortedFiles.length;
                let currentIndex = 0;

                sortedFolders.forEach(function(folderName) {
                    currentIndex++;
                    let isLast = (currentIndex === totalElements);
                    let pointer = isLast ? "└── " : "├── ";
                    
                    treeOutput += `${prefix}${pointer}📁 ${folderName}/\n`;
                    
                    let newPrefix = prefix + (isLast ? "    " : "│   ");
                    renderTree(node.folders[folderName], newPrefix);
                });

                sortedFiles.forEach(function(fileName) {
                    currentIndex++;
                    let isLast = (currentIndex === totalElements);
                    let pointer = isLast ? "└── " : "├── ";
                    
                    treeOutput += `${prefix}${pointer}📄 ${fileName}\n`;
                });
            }

            treeOutput += `📁 ${file.name}\n`;
            renderTree(root, "");

            generatedTreeText = treeOutput;
            document.getElementById('output').innerText = treeOutput;
            document.getElementById('downloadBtn').style.display = "block";
            statusBadge.innerText = "تم التوليد بنجاح! 🎉";

        }).catch(function(err) {
            document.getElementById('output').innerText = "حدث خطأ أثناء معالجة ملف الـ ZIP: " + err.message;
            statusBadge.innerText = "فشلت العملية";
        });
    };

    reader.readAsArrayBuffer(file);
}

document.getElementById('downloadBtn').addEventListener('click', function() {
    const blob = new Blob([generatedTreeText], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "connected_project_tree.txt";
    link.click();
});
