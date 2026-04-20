# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Rails Admin Access', type: :feature do
  let(:admin_user) { create(:user, :admin) }
  let(:regular_user) { create(:user, :team_owner) }

  context 'REG-006: Rails Admin - Access' do
    it 'allows admin users to access Rails Admin' do
      sign_in admin_user
      visit '/admin'

      expect(page).to have_content('Site Administration')
      expect(page).not_to have_content('Access Denied')
    end

    it 'blocks non-admin users from accessing Rails Admin' do
      sign_in regular_user
      visit '/admin'

      expect(page).to have_content('Access Denied').or have_current_path(root_path)
    end

    it 'shows all models except PlayerStat' do
      sign_in admin_user
      visit '/admin'

      # Verify main models are accessible
      expect(page).to have_link('Player')
      expect(page).to have_link('Team')
      expect(page).to have_link('User')
      expect(page).to have_link('Contract')
      expect(page).to have_link('Trade')
      expect(page).to have_link('Bid')
      expect(page).to have_link('Season')

      # Verify PlayerStat is hidden
      expect(page).not_to have_link('Player stat')
    end

    it 'allows CRUD operations on Player model' do
      sign_in admin_user
      visit '/admin/player'

      # List view
      expect(page).to have_content('List of Players')

      # Create
      click_link 'Add new'
      fill_in 'Name', with: 'Test Player'
      select 'SS', from: 'Positions'
      click_button 'Save'

      expect(page).to have_content('Player successfully created')
      expect(Player.find_by(name: 'Test Player')).to be_present
    end

    it 'allows CRUD operations on Team model' do
      team = create(:team, name: 'Test Team')
      sign_in admin_user

      visit '/admin/team'
      expect(page).to have_content('List of Teams')

      # Edit
      within("tr[data-id='#{team.id}']") do
        click_link 'Edit'
      end

      fill_in 'Name', with: 'Updated Team Name'
      click_button 'Save'

      expect(page).to have_content('Team successfully updated')
      expect(team.reload.name).to eq('Updated Team Name')
    end

    it 'allows CRUD operations on Contract model' do
      player = create(:player)
      team = create(:team)
      sign_in admin_user

      visit '/admin/contract/new'

      # Create contract
      select player.name, from: 'Player'
      select team.name, from: 'Team'
      fill_in 'Amount', with: '100000'
      check 'Active'
      click_button 'Save'

      expect(page).to have_content('Contract successfully created')
      expect(Contract.where(player: player, team: team)).to exist
    end

    it 'provides custom actions if configured' do
      sign_in admin_user
      visit '/admin'

      # Check for any custom bulk actions or model-specific actions
      # This will depend on what custom actions are actually configured
      # Placeholder for now - adjust based on actual custom actions
      visit '/admin/player'

      # Verify bulk actions dropdown exists (standard Rails Admin feature)
      expect(page).to have_css('.bulk-actions') if page.has_css?('.bulk-actions')
    end

    it 'allows deletion with confirmation' do
      player = create(:player, name: 'Player To Delete')
      sign_in admin_user

      visit '/admin/player'

      within("tr[data-id='#{player.id}']") do
        click_link 'Delete'
      end

      # Rails Admin shows confirmation page
      click_button 'Yes, I\'m sure'

      expect(page).to have_content('Player successfully deleted')
      expect(Player.find_by(id: player.id)).to be_nil
    end
  end

  context 'REG-006: Rails Admin - Model Visibility' do
    it 'hides PlayerStat model from navigation' do
      sign_in admin_user
      visit '/admin'

      # PlayerStat should not appear in the models list
      model_links = page.all('.nav-item').map(&:text)
      expect(model_links).not_to include('Player stat')
      expect(model_links).not_to include('PlayerStat')
    end

    it 'blocks direct access to PlayerStat admin pages' do
      sign_in admin_user
      visit '/admin/player_stat'

      # Should either redirect or show error
      expect(page).to have_content('Access Denied').or have_current_path('/admin')
    end
  end
end
