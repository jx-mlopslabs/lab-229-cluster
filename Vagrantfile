# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure("2") do |config|

  config.vm.box = "ubuntu/focal64"

  config.vm.provision "ansible" do |ansible|
    ansible.playbook = "provision/ansible/playbooks/ubuntu-prepare.yml"
  end
end
