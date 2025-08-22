import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../navbar/navbar.component';
import { UserService } from '../services/user.service';
import { RoleService } from '../services/role.service';
import { User } from '../models/user';
import { Role } from '../models/role';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  roles: Role[] = [];
  selectedGroup: number | null = null;
  searchTerm: string = '';
  selectedUser: User | null = null;
  editingUser: User | null = null;
  currentUser: User | null = null;
  confirmPassword: string = '';
  passwordMismatch: boolean = false;
  weakPassword: boolean = false;
  archiveNote: string = '';
  showErrorNote: boolean = false;
  selectedImage: File | null = null;
  selectedImagePreview: string | null = null;
  imageUpdated: boolean = false;
  isUploadingImage: boolean = false;
  uploadError: boolean = false;

  constructor(
    private userService: UserService,
    private roleService: RoleService,
    private router: Router

  ) { }

  private handleError(error: any): void {
    switch (error.status) {
      case 0:
        alert('Ingen forbindelse til server. Prøv igen senere.');
        break;
      case 400:
        alert('Fejl i forespørgsel til serveren. Prøv igen senere.');
        break;
      case 500:
        alert('Fejl på Serveren. Prøv igen senere.');
        break;
      default:
        alert('En ukendt fejl opstod. Prøv igen senere.');
        break;
    }
  }

  ngOnInit(): void {
    this.getUsers();
    this.getRoles();
    this.getCurrentUser();
  }

  getCurrentUser(): void {
    const user = localStorage.getItem('currentUser');
    if (user) {
      this.currentUser = JSON.parse(user);
    }
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedImage = input.files[0];


      const reader = new FileReader();
      reader.onload = () => {
        this.selectedImagePreview = reader.result as string;
      };
      reader.readAsDataURL(this.selectedImage);

      // Reset upload states
      this.imageUpdated = false;
      this.uploadError = false;
    }
  }

  uploadImageToCloudinaryAsync(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'SOP_ProfileImages');

    const cloudName = 'dkrcapzct';
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

    return fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        return data.secure_url;
      });
  }

  getUsers(): void {
    this.userService.getAll().subscribe(
      (data: User[]) => {
        this.users = data;
        this.filterUsers();
      },
      (error) => {
        this.handleError(error);
      }
    );
  }

  getRoles(): void {
    this.roleService.getAll().subscribe(
      (data: Role[]) => {
        this.roles = data;
      },
      (error) => {
        console.error('Error fetching roles', error);
      }
    );
  }

  onGroupChange(event: any): void {
    this.selectedGroup = +event.target.value;
    this.filterUsers();
  }

  onSearchChange(): void {
    this.filterUsers();
  }

  filterUsers(): void {
    this.filteredUsers = this.users.filter((user) => {
      const matchesGroup = !this.selectedGroup || user.roleId === this.selectedGroup;
      const matchesSearch =
        !this.searchTerm ||
        user.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(this.searchTerm.toLowerCase());
      return matchesGroup && matchesSearch;
    });
  }

  navigateToCreateUser(): void {
    this.router.navigate(['/create-user']);
  }

  selectUser(user: User): void {
    this.selectedUser = user;
    this.editingUser = { ...user };
    delete (this.editingUser as any).password; // Remove password field for the user clicked

    this.confirmPassword = '';
    this.passwordMismatch = false;
    this.weakPassword = false;

    if (user.roleId) {
      this.roleService.findById(user.roleId).subscribe(
        (role) => {
          this.selectedUser!.userRole = role;
        },
        (error) => {
          this.handleError(error);
        }
      );
    }
  }

  closeUserDetailPanel(): void {
    this.editingUser = null;
  }

  updateUser(user: User): void {
    // Ensure we have the latest profileImageUrl from editingUser
    if (this.editingUser?.profileImageUrl) {
      user.profileImageUrl = this.editingUser?.profileImageUrl ?? null;
    }

    if (user.password || this.confirmPassword) {
      // Password validation
      const passwordMismatch = user.password !== this.confirmPassword;
      const hasUpperCase = /[A-Z]/.test(user.password || '');
      const hasLowerCase = /[a-z]/.test(user.password || '');
      const hasNumber = /[0-9]/.test(user.password || '');
      const hasSpecialChar = /[!@#$%^&*(),-.?":{}|<>]/.test(user.password || '');
      const hasMinLength = (user.password || '').length >= 15;

      const weakPassword = !(hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar && hasMinLength);

      this.passwordMismatch = passwordMismatch;
      this.weakPassword = weakPassword;

      if (passwordMismatch || weakPassword) {
        return; // Stop if validation fails
      }
    } else {
      // No password entered → remove it so backend won’t overwrite
      delete (user as any).password;
    }

    this.userService.update(user).subscribe(
      (updatedUser) => {
        this.handleSuccessfulUpdate(updatedUser);
      },
      (error) => {
        this.handleError(error);
      }
    );
  }


  resetImage() {
    if (!this.editingUser) return;

    this.selectedImagePreview = null;
    this.editingUser.profileImageUrl = 'DELETE_IMAGE'; // Explicitly set null to clear image
    (document.getElementById('userImage') as HTMLInputElement).value = '';
    this.imageUpdated = true; // Mark image as updated so onSave uploads changes
  }

  // Helper method to handle successful updates
  private handleSuccessfulUpdate(updatedUser: User): void {
    const index = this.users.findIndex((u) => u.id === updatedUser.id);
    if (index !== -1) {
      this.users[index] = updatedUser;
    }
    this.getUsers();
    this.editingUser = null;
    this.imageUpdated = false;
    this.selectedImage = null;
    this.selectedImagePreview = null;
    alert('Bruger opdateret!');
  }

  public isDeleteDisabled(user: User | null): boolean {
    // Return true (disabled) if user has loans, handle undefined userLoans
    return !!user && (user.userLoans?.length ?? 0) > 0;
  }

  confirmArchiveUser(): void {
    if (!this.selectedUser?.id) {
      return;
    }

    // Check for loans with null-safe operation
    if (this.selectedUser.userLoans && this.selectedUser.userLoans.length > 0) {
      alert('Kan ikke arkivere, da der er lån tilknyttet denne bruger.');
      return;
    }

    if (!this.archiveNote.trim()) {
      this.showErrorNote = true;
      return;
    }

    this.userService.delete(this.selectedUser.id, this.archiveNote).subscribe({
      next: () => {
        this.getUsers();
        this.selectedUser = null;
        this.editingUser = null;
        this.closeArchiveModal();
      },
      error: (error) => {
        this.handleError(error);
      },
    });
  }

  openArchiveModal(): void {
    const modal = document.getElementById('ArhciveModal');
    if (modal) {
      modal.style.display = 'block';
    }
  }

  closeArchiveModal(): void {
    const modal = document.getElementById('ArhciveModal');
    if (modal) {
      modal.style.display = 'none';
    }
    this.archiveNote = '';
    this.showErrorNote = false;
  }

  resetPasswordValidation(): void {
    this.passwordMismatch = false;
    this.weakPassword = false;
  }

  // Updated onSave method with upload check
  async onSave(): Promise<void> {
    if (this.isUploadingImage) {
      alert('Vent venligst på at billedet bliver uploadet...');
      return;
    }

    if (this.uploadError) {
      alert('Der opstod en fejl ved upload af billede. Prøv igen.');
      return;
    }

    if (!this.editingUser) {
      alert('Kunne ikke opdatere bruger!');
      return;
    }

    // If user selected a new image but hasn't uploaded yet
    if (this.selectedImage && !this.imageUpdated) {
      try {
        this.isUploadingImage = true;
        const imageUrl = await this.uploadImageToCloudinaryAsync(this.selectedImage);
        this.editingUser.profileImageUrl = imageUrl;
        this.imageUpdated = true;
        this.isUploadingImage = false;
      } catch (error) {
        this.uploadError = true;
        this.isUploadingImage = false;
        alert('Upload til Cloudinary mislykkedes.');
        return; // Stop saving if upload failed
      }
    }

      this.updateUser({ ...this.editingUser });
  }
}