class AddFinishedStatusToSeason < ActiveRecord::Migration[6.1]
  def change
    add_column :seasons, :is_finished, :boolean, default: false
  end
end
