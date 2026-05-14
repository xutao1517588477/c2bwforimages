// 选择图片并转换
document.getElementById('uploadBtn').addEventListener('click', function () {
  document.getElementById('fileInput').click();
});

document.getElementById('fileInput').addEventListener('change', function () {
  const files = document.getElementById('fileInput').files;
  if (files.length === 0) {
    alert('请选择图片文件');
    return;
  }

  const outputBody = document.getElementById('outputBody');
  outputBody.innerHTML = ''; // 清空表格内容

  Array.from(files).forEach(file => {
    if (file.type.startsWith('image/gif')) {
      alert(`文件 "${file.name}" 是 GIF 格式，将只保留第一帧进行转换。`);
      return;
    }
  });

  Array.from(files).forEach(file => {
    if (!file.type.startsWith('image/')) {
      return; // 跳过非图片文件
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;

        // 绘制原图
        ctx.drawImage(img, 0, 0);

        // 获取图像数据
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // 转换为灰度
        for (let i = 0; i < data.length; i += 4) {
          const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
          data[i] = gray;     // Red
          data[i + 1] = gray; // Green
          data[i + 2] = gray; // Blue
          // Alpha 保持不变
        }

        // 将灰度图像放回canvas
        ctx.putImageData(imageData, 0, 0);

        // 创建表格行
        const tr = document.createElement('tr');

        // 第一列：文件名
        const tdName = document.createElement('td');
        tdName.textContent = file.name;
        tr.appendChild(tdName);

        // 第二列：原始图像
        const tdOriginal = document.createElement('td');
        const imgOriginal = document.createElement('img');
        imgOriginal.src = e.target.result;
        tdOriginal.appendChild(imgOriginal);
        tr.appendChild(tdOriginal);

        // 第三列：转换结果
        const tdConverted = document.createElement('td');
        const imgConverted = document.createElement('img');
        imgConverted.src = canvas.toDataURL(`${file.type}`);
        imgConverted.setAttribute('data-filename', file.name);
        tdConverted.appendChild(imgConverted);
        tr.appendChild(tdConverted);

        outputBody.appendChild(tr);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
});

// 清空表格内容和文件输入
document.getElementById('clearBtn').addEventListener('click', function () {
  document.getElementById('outputBody').innerHTML = ''; // 清空表格内容
  document.getElementById('fileInput').value = ''; // 清空文件输入

  // 给表格体添加一个空行，保持表格结构
  const outputBody = document.getElementById('outputBody');
  const emptyRow = document.createElement('tr');
  const emptyCell = document.createElement('td');
  emptyCell.setAttribute('colspan', '3');
  emptyCell.textContent = '请点击 "选择图片" 按钮上传图片进行转换';
  emptyRow.appendChild(emptyCell);
  outputBody.appendChild(emptyRow);
});

// 导出为zip文件
document.getElementById('exportBtn').addEventListener('click', function () {
  const outputBody = document.getElementById('outputBody');
  const rows = outputBody.querySelectorAll('tr');
  if (rows.length === 0 ||
    (rows.length === 1 && rows[0].innerText.includes('请点击 "选择图片" 按钮上传图片进行转换'))
  ) {
    alert('没有图片可导出');
    return;
  } else {
    const zip = new JSZip();
    rows.forEach((row, index) => {
      const imgElement = row.querySelector('td:nth-child(3) img');
      if (imgElement) {
        const imgSrc = imgElement.src;
        const name = imgElement.getAttribute('data-filename') || `converted_image_${index + 1}.png`;
        // Add image to zip file
        zip.file(name, imgSrc.split(',')[1], { base64: true });
      }
    });
    zip.generateAsync({ type: "blob" }).then(function (blob) {
      // Download the zip file
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const timeString = new Date().toLocaleString().replace(/[/:\s]/g, '_'); // 格式化时间字符串，替换不合法字符
      link.download = `converted_images[${timeString}].zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }
});
