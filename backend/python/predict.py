import sys
import json
import torch
import torch.nn as nn
from torchvision import transforms
from PIL import Image
import os

class SiameseNetwork(nn.Module):
    def __init__(self):
        super(SiameseNetwork, self).__init__()
        
        self.cnn1 = nn.Sequential(
            nn.Conv2d(1, 20, kernel_size=9, padding=4),
            nn.ReLU(inplace=True),
            nn.LocalResponseNorm(5, alpha=0.0001, beta=0.75, k=2),
            nn.MaxPool2d(3, stride=2),
            nn.Dropout2d(p=0.2),
            
            nn.Conv2d(20, 40, kernel_size=7, padding=3),
            nn.ReLU(inplace=True),
            nn.LocalResponseNorm(5, alpha=0.0001, beta=0.75, k=2),
            nn.MaxPool2d(3, stride=2),
            nn.Dropout2d(p=0.2),
            
            nn.Conv2d(40, 80, kernel_size=5, padding=2),
            nn.ReLU(inplace=True),
            nn.LocalResponseNorm(5, alpha=0.0001, beta=0.75, k=2),
            nn.MaxPool2d(3, stride=2),
            nn.Dropout2d(p=0.2),
            
            nn.Conv2d(80, 160, kernel_size=3, padding=1),
            nn.ReLU(inplace=True),
            nn.LocalResponseNorm(5, alpha=0.0001, beta=0.75, k=2),
            nn.MaxPool2d(3, stride=2),
            nn.AdaptiveAvgPool2d((4, 4))
        )
        
        self.fc1 = nn.Sequential(
            nn.Linear(2560, 640),
            nn.ReLU(inplace=True),
            nn.Dropout(p=0.2),
            
            nn.Linear(640, 160),
            nn.ReLU(inplace=True),
            nn.Dropout(p=0.2),
            
            nn.Linear(160, 40),
            nn.ReLU(inplace=True),
            nn.Dropout(p=0.2),
            
            nn.Linear(40, 10)
        )
        
    def forward_once(self, x):
        x = self.cnn1(x)
        x = x.view(x.size(0), -1)
        x = self.fc1(x)
        return x
    
    def forward(self, input1, input2):
        output1 = self.forward_once(input1)
        output2 = self.forward_once(input2)
        return output1, output2

def process_image(img_path):
    transform = transforms.Compose([
        transforms.Grayscale(num_output_channels=1),
        transforms.Resize((270, 650)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.5], std=[0.5])
    ])
    img = Image.open(img_path).convert('L')
    return transform(img).unsqueeze(0)

def main():
    if len(sys.argv) != 3:
        print(json.dumps({'error': 'Invalid number of arguments'}))
        sys.exit(1)

    try:
        device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        model = SiameseNetwork().to(device)
        
        # Load the model from the correct path
        model_path = os.path.join(os.path.dirname(__file__), '..', 'models', 'best_model.pt')
        model.load_state_dict(torch.load(model_path, map_location=device))
        model.eval()

        # Process images
        img1 = process_image(sys.argv[1]).to(device)
        img2 = process_image(sys.argv[2]).to(device)

        # Make prediction
        with torch.no_grad():
            out1, out2 = model(img1, img2)
            distance = torch.norm(out1 - out2, p=2).item()

        # Determine result
        threshold = 1.0
        prediction = 'توقيع أصلي' if distance < threshold else 'توقيع مزيف'
        confidence = 100 * (1 - distance/threshold) if prediction == 'توقيع أصلي' else 100 * (distance - threshold)/(2 - threshold)

        # Return result as JSON
        result = {
            'prediction': prediction,
            'confidence': round(confidence, 2)
        }
        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({'error': str(e)}))
        sys.exit(1)

if __name__ == '__main__':
    main()