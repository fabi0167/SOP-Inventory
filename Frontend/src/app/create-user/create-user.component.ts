import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { NavbarComponent } from '../navbar/navbar.component';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-create-user',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './create-user.component.html',
  styleUrls: ['./create-user.component.css'],
})
export class CreateUserComponent implements OnInit {
  user: any = {};
  confirmPassword: string = '';
  currentUser: any = null;

  passwordMismatch = false;
  weakPassword = false;

  previewImage: string | ArrayBuffer | null = null;
  selectedImageFile: File | null = null;

  constructor(private userService: UserService, private router: Router) { }

  ngOnInit(): void {
    const userFromStorage = localStorage.getItem('currentUser');
    if (userFromStorage) {
      this.currentUser = JSON.parse(userFromStorage);
    }
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files[0]) {
      this.selectedImageFile = input.files[0];

      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target?.result !== undefined) {
          this.previewImage = e.target.result;
        }
      };
      reader.readAsDataURL(this.selectedImageFile);
    }
  }

  validatePassword(): void {
    const password = this.user.password || '';
    this.passwordMismatch = password !== this.confirmPassword;

    const isValid = [
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /[0-9]/.test(password),
      /[!@#$%^&*(),-.?":{}|<>]/.test(password),
      password.length >= 15
    ].every(Boolean);

    this.weakPassword = !isValid;
  }

  createUser(form: NgForm): void {
    if (this.passwordMismatch || this.weakPassword || !form.valid) {
      return;
    }

    if (this.selectedImageFile) {
      // Step 1: Upload image to Cloudinary
      const formData = new FormData();
      formData.append('file', this.selectedImageFile);
      formData.append('upload_preset', 'SOP_ProfileImages'); // Replace with your actual preset

      const cloudName = 'dkrcapzct'; // Replace with your Cloudinary cloud name

      fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      })
        .then(res => res.json())
        .then(data => {
          if (data.secure_url) {
            this.user.ProfileImageUrl  = data.secure_url; // Step 2: Store image URL in user object
            this.sendUserData(form);
          } else {
            alert('Billedupload fejlede. Prøv igen.');
          }
        })
        .catch(err => {
          console.error('Cloudinary upload error:', err);
          alert('Fejl ved upload af billede.');
        });
    } else {
      // No image selected, just send user data
      this.sendUserData(form);
    }
  }

  // Helper method to send user to backend
  private sendUserData(form: NgForm) {
    this.userService.create(this.user).subscribe({
      next: (response) => {
        // console.log('User created:', response);
        form.resetForm();
        this.previewImage = null;
        this.navigateAfterCreate();
      },
      error: (error) => {
        this.handleError(error);
      }
    });
  }


  onRoleChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.user.roleId = +select.value;
  }

  private navigateAfterCreate(): void {
    if (!this.currentUser?.role?.id) {
      this.router.navigate(['/']);
      return;
    }

    switch (this.currentUser.role.id) {
      case 1:
        this.router.navigate(['/users']);
        break;
      case 2:
      case 4:
        this.router.navigate(['/students']);
        break;
      default:
        this.router.navigate(['/']);
    }
  }

  private handleError(error: any): void {
    let message = 'En ukendt fejl opstod. Prøv igen senere.';

    if (error.status === 0) {
      message = 'Ingen forbindelse til server. Prøv igen senere.';
    } else if (error.status === 400) {
      message = 'Fejl i forespørgsel til serveren. Prøv igen senere.';
    } else if (error.status === 500) {
      message = 'Fejl på serveren. Prøv igen senere.';
    }

    alert(message);
  }
}
