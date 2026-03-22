"""
Export trained Sen2Fire U-Net to ONNX format for backend inference.

Wraps the 2-class U-Net output to a single binary logit (fire class),
matching what the backend's wildfire_inference.py expects.

Usage:
    python export_onnx.py --model_dir ./Exp/input_all_bands_aerosol/weight_10.0_time.../
    python export_onnx.py --model_path ./Exp/.../best_model.pth --mode 1
"""

import argparse
import os
import torch
import torch.nn as nn
import numpy as np
from model.Networks import unet


modename = [
    'all_bands',                   # 0  -> 12 channels
    'all_bands_aerosol',           # 1  -> 13 channels
    'rgb',                         # 2  -> 3 channels
    'rgb_aerosol',                 # 3  -> 4 channels
    'swir',                        # 4  -> 3 channels
    'swir_aerosol',                # 5  -> 4 channels
    'nbr',                         # 6  -> 3 channels
    'nbr_aerosol',                 # 7  -> 4 channels
    'ndvi',                        # 8  -> 3 channels
    'ndvi_aerosol',                # 9  -> 4 channels
    'rgb_swir_nbr_ndvi',           # 10 -> 6 channels
    'rgb_swir_nbr_ndvi_aerosol',   # 11 -> 7 channels
]

MODE_TO_CHANNELS = {
    0: 12, 1: 13,
    2: 3, 3: 4,
    4: 3, 5: 4,
    6: 3, 7: 4,
    8: 3, 9: 4,
    10: 6, 11: 7,
}


class FireLogitWrapper(nn.Module):
    """Wraps the 2-class U-Net to output a single fire-class logit.
    
    The backend applies sigmoid + threshold >0.5, so we give it
    the raw logit for class 1 (fire) as shape (B, 1, H, W).
    """
    def __init__(self, base_model: nn.Module):
        super().__init__()
        self.base_model = base_model

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        logits = self.base_model(x)       # (B, 2, H, W)
        fire_logit = logits[:, 1:2, :, :]  # (B, 1, H, W) — fire class
        return fire_logit


def get_arguments():
    parser = argparse.ArgumentParser(description='Export Sen2Fire U-Net to ONNX')
    
    parser.add_argument("--model_path", type=str, default=None,
                        help="Path to the trained .pth weights file.")
    parser.add_argument("--model_dir", type=str, default=None,
                        help="Path to experiment directory (will look for best_model.pth inside).")
    parser.add_argument("--mode", type=int, default=1,
                        help="Input mode (must match training). Default=1 (all_bands_aerosol, 13ch).")
    parser.add_argument("--num_classes", type=int, default=2,
                        help="Number of classes the model was trained with.")
    parser.add_argument("--output", type=str, default=None,
                        help="Output ONNX file path. Default: models/sen2fire_unet.onnx")
    parser.add_argument("--patch_size", type=int, default=512,
                        help="Input patch size (default 512).")
    
    return parser.parse_args()


def main():
    args = get_arguments()
    
    # Resolve model path
    if args.model_path:
        model_path = args.model_path
    elif args.model_dir:
        model_path = os.path.join(args.model_dir, 'best_model.pth')
    else:
        # Try to find the latest experiment
        exp_dir = './Exp/'
        if not os.path.exists(exp_dir):
            print("ERROR: No --model_path or --model_dir specified and ./Exp/ doesn't exist.")
            return
        subdirs = sorted([d for d in os.listdir(exp_dir) if os.path.isdir(os.path.join(exp_dir, d))])
        if not subdirs:
            print("ERROR: No experiment directories found in ./Exp/")
            return
        # Look for the latest one
        for subdir in subdirs:
            weight_dirs = sorted([d for d in os.listdir(os.path.join(exp_dir, subdir)) 
                                  if os.path.isdir(os.path.join(exp_dir, subdir, d))])
            if weight_dirs:
                model_path = os.path.join(exp_dir, subdir, weight_dirs[-1], 'best_model.pth')
                break
        else:
            print("ERROR: No model found in ./Exp/")
            return
    
    if not os.path.exists(model_path):
        print(f"ERROR: Model file not found: {model_path}")
        return
    
    print(f"Loading model from: {model_path}")
    
    # Determine channels
    n_channels = MODE_TO_CHANNELS[args.mode]
    print(f"Mode: {args.mode} ({modename[args.mode]}) -> {n_channels} input channels")
    
    # Build model
    model = unet(n_classes=args.num_classes, n_channels=n_channels)
    state_dict = torch.load(model_path, map_location='cpu', weights_only=True)
    model.load_state_dict(state_dict)
    model.eval()
    
    # Wrap to output single fire logit
    wrapped_model = FireLogitWrapper(model)
    wrapped_model.eval()
    
    # Dummy input
    dummy_input = torch.randn(1, n_channels, args.patch_size, args.patch_size)
    
    # Resolve output path
    if args.output:
        output_path = args.output
    else:
        # Default: backend/models/sen2fire_unet.onnx
        backend_models_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 
                                           'backend', 'models')
        if not os.path.exists(os.path.dirname(os.path.abspath(backend_models_dir))):
            backend_models_dir = os.path.join('.', 'models')
        os.makedirs(backend_models_dir, exist_ok=True)
        output_path = os.path.join(backend_models_dir, 'sen2fire_unet.onnx')
    
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    
    # Export
    print(f"Exporting ONNX to: {output_path}")
    print(f"  Input shape:  (1, {n_channels}, {args.patch_size}, {args.patch_size})")
    print(f"  Output shape: (1, 1, {args.patch_size}, {args.patch_size})")
    
    torch.onnx.export(
        wrapped_model,
        dummy_input,
        output_path,
        opset_version=17,
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={
            'input': {0: 'batch_size'},
            'output': {0: 'batch_size'},
        },
    )
    
    print(f"\n[OK] ONNX model exported successfully!")
    print(f"   File: {output_path}")
    print(f"   Size: {os.path.getsize(output_path) / 1024 / 1024:.1f} MB")
    
    # Quick verification
    try:
        import onnxruntime as ort
        session = ort.InferenceSession(output_path, providers=['CPUExecutionProvider'])
        inp = session.get_inputs()[0]
        out = session.get_outputs()[0]
        print(f"\n[VERIFY] ONNX Verification:")
        print(f"   Input:  name='{inp.name}', shape={inp.shape}, dtype={inp.type}")
        print(f"   Output: name='{out.name}', shape={out.shape}, dtype={out.type}")
        
        # Test inference
        test_input = np.random.randn(1, n_channels, args.patch_size, args.patch_size).astype(np.float32)
        result = session.run([out.name], {inp.name: test_input})[0]
        print(f"   Test output shape: {result.shape}")
        print(f"   [OK] ONNX inference test passed!")
    except ImportError:
        print("\n[WARN] onnxruntime not installed -- skipping verification. Install with: pip install onnxruntime")


if __name__ == '__main__':
    main()
