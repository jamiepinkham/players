class AddCommentToTeam < ActiveRecord::Migration[5.0]
  def change
    add_column :teams, :comment, :string
  end
end
