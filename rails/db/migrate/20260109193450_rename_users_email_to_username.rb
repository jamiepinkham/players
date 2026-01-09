class RenameUsersEmailToUsername < ActiveRecord::Migration[6.1]
  def change
    # Rename the column
    rename_column :users, :email, :username

    # Remove old index on email
    remove_index :users, :email if index_exists?(:users, :email)

    # Add new index on username
    add_index :users, :username, unique: true unless index_exists?(:users, :username)
  end
end
