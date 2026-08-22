# Kiểm tra tiến độ tải Whisper Model

## 🎯 Model đang tải ở đâu?

```
C:\Users\nguye\.cache\huggingface\hub\models--Systran--faster-whisper-medium\
```

## 🔍 Cách kiểm tra tiến độ:

### Option 1: Kiểm tra Python process đang chạy

```powershell
# PowerShell
Get-Process python -ErrorAction SilentlyContinue | 
  Select-Object ProcessName, Id, CPU, @{Name='RAM(MB)';Expression={[math]::Round($_.WorkingSet/1MB,0)}} | 
  Format-Table
```

**Đang tải nếu:**
- ✅ Process `python` có trong list
- ✅ CPU > 5% (đang download + decompress)
- ✅ RAM tăng dần (150MB → 300MB)

**Đã xong nếu:**
- ❌ Process `python` không còn
- ✅ Model folder đã đầy đủ file

### Option 2: Kiểm tra folder cache

```powershell
# PowerShell - Kiểm tra tổng dung lượng đã tải
$folder = "$env:USERPROFILE\.cache\huggingface\hub\models--Systran--faster-whisper-medium"
if (Test-Path $folder) {
    $size = (Get-ChildItem -Path $folder -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1GB
    Write-Host "Đã tải: $([math]::Round($size, 2)) GB / ~1.5 GB"
} else {
    Write-Host "Chưa bắt đầu tải"
}
```

### Option 3: Kiểm tra files trong cache

```powershell
# PowerShell - List files
Get-ChildItem "$env:USERPROFILE\.cache\huggingface\hub\models--Systran--faster-whisper-medium" -Recurse -File | 
  Select-Object Name, @{Name='Size(MB)';Expression={[math]::Round($_.Length/1MB,1)}} | 
  Format-Table
```

**Files cần có (khi hoàn tất):**
```
config.json
model.bin (~1.5GB)
tokenizer.json
vocabulary.txt
...
```

## ⏱️ Thời gian tải ước tính:

| Tốc độ mạng | Thời gian |
|-------------|-----------|
| 100 Mbps    | ~2-3 phút |
| 50 Mbps     | ~4-5 phút |
| 10 Mbps     | ~20 phút  |

## 🚨 Nếu treo quá lâu (>10 phút):

1. **Kill Python process:**
   ```powershell
   Stop-Process -Name python -Force
   ```

2. **Xóa cache bị hỏng:**
   ```powershell
   Remove-Item "$env:USERPROFILE\.cache\huggingface\hub\models--Systran--faster-whisper-medium" -Recurse -Force
   ```

3. **Chạy lại từ đầu**

## ✅ Khi nào biết đã xong?

**Cách 1: App hiện kết quả**
- Alert: "Nhận diện giọng nói hoàn tất!"
- Timeline có phụ đề xuất hiện

**Cách 2: Kiểm tra model cache**
```powershell
# Nếu lệnh này trả về True = Model đã tải xong
$folder = "$env:USERPROFILE\.cache\huggingface\hub\models--Systran--faster-whisper-medium"
(Test-Path $folder) -and ((Get-ChildItem -Path $folder -Recurse -File).Count -gt 5)
```

**Cách 3: Python process đã tắt**
```powershell
# Nếu trả về rỗng = Process đã xong
Get-Process python -ErrorAction SilentlyContinue
```

## 💡 Lần sau:

Model đã cache rồi → **Chạy ngay trong vài giây**, không cần tải lại!

---

**Current Status:**
- Python process ID: 42988
- CPU: ~14%
- RAM: ~264MB
- Status: Đang tải model (~1.5GB)
